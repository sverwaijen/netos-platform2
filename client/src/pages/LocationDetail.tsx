import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useParams, Link } from "wouter";
import { useState, useMemo } from "react";
import {
  ArrowLeft, MapPin, Users as UsersIcon, Clock, Filter, Search,
  Monitor, Phone, Coffee, Dumbbell, Calendar, ChevronLeft, ChevronRight, CreditCard
} from "lucide-react";
import { getLocationImage } from "@/lib/brand";

const RESOURCE_ICONS: Record<string, any> = {
  desk: Monitor, meeting_room: UsersIcon, private_office: Coffee,
  phone_booth: Phone, open_space: MapPin, event_space: Calendar,
  locker: Coffee, gym: Dumbbell,
};
const ZONE_COLORS: Record<string, string> = {
  zone_0: "bg-emerald-500/20 text-emerald-400", zone_1: "bg-blue-500/20 text-blue-400",
  zone_2: "bg-amber-500/20 text-amber-400", zone_3: "bg-purple-500/20 text-purple-400",
};
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function LocationDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { user, isAuthenticated } = useAuth();

  const { data: location, isLoading: locLoading } = trpc.locations.bySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: allResources, isLoading: resLoading } = trpc.resources.byLocation.useQuery(
    { locationId: location?.id ?? 0 }, { enabled: !!location }
  );
  const { data: multipliers } = trpc.multipliers.byLocation.useQuery(
    { locationId: location?.id ?? 0 }, { enabled: !!location }
  );
  const { data: myWallets } = trpc.wallets.mine.useQuery(undefined, { enabled: isAuthenticated });

  const [typeFilter, setTypeFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("all");

  const [bookingResource, setBookingResource] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<number | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [selectedWalletType, setSelectedWalletType] = useState("personal");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  const { data: availability } = trpc.resources.availability.useQuery(
    { resourceId: bookingResource?.id ?? 0, dateStart: selectedDate.getTime(), dateEnd: selectedDate.getTime() + 86400000 },
    { enabled: !!bookingResource }
  );

  const utils = trpc.useUtils();
  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Booked! ${data.creditsCost.toFixed(1)} credits (${data.multiplier}x multiplier)`);
      setBookingResource(null);
      setSelectedStart(null);
      setSelectedEnd(null);
      setBookingNotes("");
      utils.wallets.mine.invalidate();
      utils.bookings.mine.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredResources = useMemo(() => {
    if (!allResources) return [];
    return allResources.filter((r: any) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (zoneFilter !== "all" && r.zone !== zoneFilter) return false;
      if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (capacityFilter !== "all") {
        const min = parseInt(capacityFilter);
        if ((r.capacity ?? 0) < min) return false;
      }
      return true;
    });
  }, [allResources, typeFilter, zoneFilter, searchQuery, capacityFilter]);

  const resourceTypes = useMemo(() => {
    if (!allResources) return [];
    return Array.from(new Set(allResources.map((r: any) => r.type)));
  }, [allResources]);

  const multiplierMap = useMemo(() => {
    const m: Record<number, number> = {};
    multipliers?.forEach((mul: any) => { m[mul.dayOfWeek] = parseFloat(mul.multiplier); });
    return m;
  }, [multipliers]);

  const todayMultiplier = multiplierMap[selectedDate.getDay()] ?? 1.0;

  const occupiedSlots = useMemo(() => {
    const set = new Set<number>();
    availability?.forEach((b: any) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      for (let h = start.getHours(); h < end.getHours(); h++) set.add(h);
    });
    return set;
  }, [availability]);

  const personalWallet = myWallets?.find((w: any) => w.type === "personal");
  const companyWallet = myWallets?.find((w: any) => w.type === "company");
  const activeWallet = selectedWalletType === "company" && companyWallet ? companyWallet : personalWallet;

  const estimatedCost = useMemo(() => {
    if (!bookingResource || selectedStart === null || selectedEnd === null) return 0;
    const hours = selectedEnd - selectedStart;
    return parseFloat(bookingResource.creditCostPerHour) * hours * todayMultiplier;
  }, [bookingResource, selectedStart, selectedEnd, todayMultiplier]);

  function handleBook() {
    if (!bookingResource || selectedStart === null || selectedEnd === null || !location) return;
    const startTime = new Date(selectedDate);
    startTime.setHours(selectedStart, 0, 0, 0);
    const endTime = new Date(selectedDate);
    endTime.setHours(selectedEnd, 0, 0, 0);
    createBooking.mutate({
      resourceId: bookingResource.id, locationId: location.id,
      startTime: startTime.getTime(), endTime: endTime.getTime(),
      walletId: activeWallet?.id, notes: bookingNotes || undefined,
    });
  }

  function shiftDate(days: number) {
    const d = new Date(selectedDate); d.setDate(d.getDate() + days);
    setSelectedDate(d); setSelectedStart(null); setSelectedEnd(null);
  }

  if (locLoading) return <div className="space-y-4 p-1">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  if (!location) return <div className="text-center py-20 text-muted-foreground">Location not found</div>;

  const heroImg = getLocationImage(slug);

  return (
    <div className="space-y-6 p-1">
      {/* Hero image */}
      <div className="relative -m-6 mb-0 h-64 overflow-hidden">
        <img src={heroImg} alt={location.name} className="w-full h-full object-cover brightness-[0.5] saturate-[0.8]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Link href="/locations"><Button variant="ghost" size="sm" className="mb-3 -ml-2 text-white/70 hover:text-white hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-1" />All locations</Button></Link>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-2">Mr. Green Boutique Office</div>
              <h1 className="text-3xl font-extralight tracking-[-0.5px] text-white">{location.name}</h1>
              <p className="text-white/50 text-sm flex items-center gap-1 mt-1 font-light"><MapPin className="w-3 h-3" />{location.address}, {location.city}</p>
            </div>
            <span className="text-[10px] text-white/40 tracking-[2px] uppercase font-medium">{location.totalResources} resources</span>
          </div>
        </div>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3"><CreditCard className="w-4 h-4 text-[#627653]" /><span className="text-sm font-medium">Dynamic Pricing</span></div>
          <div className="grid grid-cols-7 gap-2">
            {DAY_NAMES.map((day, i) => {
              const m = multiplierMap[i] ?? 1.0;
              const isToday = new Date().getDay() === i;
              return (
                <div key={day} className={`text-center p-2 rounded-lg ${isToday ? "bg-primary/20 ring-1 ring-primary/40" : "bg-secondary/50"}`}>
                  <div className="text-xs text-muted-foreground">{day}</div>
                  <div className={`text-sm font-bold mt-1 ${m < 0.7 ? "text-netos-green" : m > 1.1 ? "text-amber-400" : "text-foreground"}`}>{m}x</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">Filter Resources</span></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative col-span-2 md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary/50 border-border/50" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {resourceTypes.map((t: string) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Zone" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="zone_0">Zone 0</SelectItem>
                <SelectItem value="zone_1">Zone 1</SelectItem>
                <SelectItem value="zone_2">Zone 2</SelectItem>
                <SelectItem value="zone_3">Zone 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={capacityFilter} onValueChange={setCapacityFilter}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Capacity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="8">8+</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center text-sm text-muted-foreground">{filteredResources.length} found</div>
          </div>
        </CardContent>
      </Card>

      {resLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : filteredResources.length === 0 ? (
        <Card className="glass-card border-border/50"><CardContent className="p-12 text-center"><MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" /><h3 className="text-lg font-medium mb-2">No resources found</h3><p className="text-sm text-muted-foreground">Try adjusting your filters.</p></CardContent></Card>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((r: any) => {
            const Icon = RESOURCE_ICONS[r.type] || MapPin;
            return (
              <Card key={r.id} className="glass-card border-border/50 hover:border-primary/30 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
                      <div>
                        <h3 className="font-medium text-sm">{r.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{r.type.replace("_", " ")} · Floor {r.floor || "1"}</p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${ZONE_COLORS[r.zone] || ""}`}>{r.zone.replace("_", " ")}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" />{r.capacity ?? 1}</span>
                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{parseFloat(r.creditCostPerHour).toFixed(1)}c/h</span>
                  </div>
                  {r.amenities && r.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(r.amenities as string[]).slice(0, 4).map((a: string) => (
                        <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground">{a}</span>
                      ))}
                      {r.amenities.length > 4 && <span className="text-[10px] text-muted-foreground">+{r.amenities.length - 4}</span>}
                    </div>
                  )}
                  <Button size="sm" className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all" onClick={() => { setBookingResource(r); setSelectedStart(null); setSelectedEnd(null); }}>
                    <Calendar className="w-3 h-3 mr-1.5" />Book Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {filteredResources.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filteredResources.length)} of {filteredResources.length}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4 mr-1" />Previous</Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= filteredResources.length} onClick={() => setPage(p => p + 1)}>Next<ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}
        </>
      )}

      <Dialog open={!!bookingResource} onOpenChange={(open) => { if (!open) setBookingResource(null); }}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Book {bookingResource?.name}</DialogTitle>
            <DialogDescription>{bookingResource?.type?.replace("_", " ")} · {bookingResource?.capacity} seats · {parseFloat(bookingResource?.creditCostPerHour ?? "0").toFixed(1)}c/hour</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
            <Button variant="ghost" size="icon" onClick={() => shiftDate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <div className="text-center">
              <p className="text-sm font-medium">{selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
              <p className="text-xs text-muted-foreground">Multiplier: <span className={todayMultiplier < 0.7 ? "text-netos-green font-bold" : todayMultiplier > 1.1 ? "text-amber-400 font-bold" : ""}>{todayMultiplier}x</span></p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => shiftDate(1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Select time slot</p>
            <div className="grid grid-cols-7 gap-1.5">
              {HOURS.map((h) => {
                const isOccupied = occupiedSlots.has(h);
                const isSelected = selectedStart !== null && selectedEnd !== null && h >= selectedStart && h < selectedEnd;
                return (
                  <button key={h} disabled={isOccupied}
                    onClick={() => {
                      if (selectedStart === null || selectedEnd !== null) { setSelectedStart(h); setSelectedEnd(h + 1); }
                      else if (h > selectedStart) { setSelectedEnd(h + 1); }
                      else { setSelectedStart(h); setSelectedEnd(h + 1); }
                    }}
                    className={`p-2 rounded-md text-xs font-medium transition-all ${isOccupied ? "bg-destructive/20 text-destructive/60 cursor-not-allowed line-through" : isSelected ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-foreground hover:bg-primary/20"}`}
                  >{h}:00</button>
                );
              })}
            </div>
          </div>
          {myWallets && myWallets.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Pay with</p>
              <div className="flex gap-2">
                {personalWallet && (
                  <button onClick={() => setSelectedWalletType("personal")} className={`flex-1 p-3 rounded-lg border text-left transition-all ${selectedWalletType === "personal" ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30"}`}>
                    <p className="text-xs text-muted-foreground">Personal</p>
                    <p className="text-sm font-bold">{parseFloat(personalWallet.balance).toFixed(0)}c</p>
                  </button>
                )}
                {companyWallet && (
                  <button onClick={() => setSelectedWalletType("company")} className={`flex-1 p-3 rounded-lg border text-left transition-all ${selectedWalletType === "company" ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30"}`}>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-bold">{parseFloat(companyWallet.balance).toFixed(0)}c</p>
                  </button>
                )}
              </div>
            </div>
          )}
          <Textarea placeholder="Add notes (optional)" value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} className="bg-secondary/50 border-border/50 text-sm" rows={2} />
          {selectedStart !== null && selectedEnd !== null && (
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{selectedEnd - selectedStart}h × {parseFloat(bookingResource?.creditCostPerHour ?? "0").toFixed(1)}c/h</span>
                <span>Base: {(parseFloat(bookingResource?.creditCostPerHour ?? "0") * (selectedEnd - selectedStart)).toFixed(1)}c</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Multiplier</span><span>{todayMultiplier}x</span></div>
              <div className="flex justify-between text-sm font-bold border-t border-border/30 pt-1 mt-1"><span>Total</span><span className="text-netos-green">{estimatedCost.toFixed(1)} credits</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingResource(null)}>Cancel</Button>
            <Button disabled={selectedStart === null || selectedEnd === null || createBooking.isPending || !isAuthenticated} onClick={handleBook} className="bg-primary text-primary-foreground">
              {createBooking.isPending ? "Booking..." : `Confirm (${estimatedCost.toFixed(1)}c)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
