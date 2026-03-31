import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "wouter";
import {
  Calendar, Clock, MapPin, CreditCard, X, Monitor, Users, Phone,
  Coffee, Dumbbell, Plus, CheckCircle2, XCircle, Timer
} from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  desk: Monitor, meeting_room: Users, private_office: Coffee,
  phone_booth: Phone, open_space: MapPin, event_space: Calendar,
  locker: Coffee, gym: Dumbbell,
};
const STATUS_STYLES: Record<string, { color: string; icon: any; label: string }> = {
  confirmed: { color: "bg-netos-green/20 text-netos-green", icon: CheckCircle2, label: "Confirmed" },
  pending: { color: "bg-amber-500/20 text-amber-400", icon: Timer, label: "Pending" },
  cancelled: { color: "bg-red-500/20 text-red-400", icon: XCircle, label: "Cancelled" },
  completed: { color: "bg-blue-500/20 text-blue-400", icon: CheckCircle2, label: "Completed" },
  checked_in: { color: "bg-purple-500/20 text-purple-400", icon: CheckCircle2, label: "Checked In" },
};

export default function Bookings() {
  const { isAuthenticated } = useAuth();
  const { data: bookings, isLoading } = trpc.bookings.mine.useQuery(undefined, { enabled: isAuthenticated });
  const [cancelTarget, setCancelTarget] = useState<any>(null);

  const utils = trpc.useUtils();
  const cancelMutation = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled. Credits refunded.");
      setCancelTarget(null);
      utils.bookings.mine.invalidate();
      utils.wallets.mine.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const upcoming = (bookings ?? []).filter((b: any) => new Date(b.startTime) > new Date() && b.status !== "cancelled");
  const past = (bookings ?? []).filter((b: any) => new Date(b.startTime) <= new Date() || b.status === "cancelled");
  const totalCreditsSpent = (bookings ?? []).filter((b: any) => b.status !== "cancelled").reduce((sum: number, b: any) => sum + parseFloat(b.creditsCost || "0"), 0);
  const totalHours = (bookings ?? []).filter((b: any) => b.status !== "cancelled").reduce((sum: number, b: any) => {
    const s = new Date(b.startTime).getTime();
    const e = new Date(b.endTime).getTime();
    return sum + (e - s) / 3600000;
  }, 0);

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">View and manage your workspace bookings.</p>
        </div>
        <Link href="/locations"><Button className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />New Booking</Button></Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{(bookings ?? []).length}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Upcoming</p><p className="text-2xl font-bold text-netos-green">{upcoming.length}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Credits Spent</p><p className="text-2xl font-bold">{totalCreditsSpent.toFixed(0)}c</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Hours Booked</p><p className="text-2xl font-bold">{totalHours.toFixed(0)}h</p></CardContent></Card>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="p-4">
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
              <TabsTrigger value="all">All ({(bookings ?? []).length})</TabsTrigger>
            </TabsList>
            {["upcoming", "past", "all"].map((tab) => {
              const items = tab === "upcoming" ? upcoming : tab === "past" ? past : (bookings ?? []);
              return (
                <TabsContent key={tab} value={tab}>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {items.map((b: any) => {
                        const Icon = TYPE_ICONS[b.resourceType] || MapPin;
                        const status = STATUS_STYLES[b.status] || STATUS_STYLES.confirmed;
                        const StatusIcon = status.icon;
                        const start = new Date(b.startTime);
                        const end = new Date(b.endTime);
                        const hours = (end.getTime() - start.getTime()) / 3600000;
                        const isFuture = start > new Date();
                        const canCancel = isFuture && b.status !== "cancelled";
                        return (
                          <div key={b.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors border border-border/20">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-6 h-6 text-primary" /></div>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h3 className="font-medium text-sm">{b.resourceName || `Resource #${b.resourceId}`}</h3>
                                  <Badge className={`text-[10px] ${status.color}`}><StatusIcon className="w-3 h-3 mr-1" />{status.label}</Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.locationName || "Location"}</span>
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{start.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{start.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })} - {end.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</span>
                                  <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{hours.toFixed(1)}h</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-mono font-bold text-netos-green">{parseFloat(b.creditsCost || "0").toFixed(1)}c</p>
                                <p className="text-[10px] text-muted-foreground">{parseFloat(b.multiplierApplied || b.multiplier || "1").toFixed(2)}x</p>
                              </div>
                              {canCancel && (
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" onClick={() => setCancelTarget(b)}><X className="w-4 h-4" /></Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {items.length === 0 && (
                        <div className="text-center py-16">
                          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium mb-2">No bookings</h3>
                          <p className="text-sm text-muted-foreground mb-4">{tab === "upcoming" ? "No upcoming bookings." : "No booking history."}</p>
                          <Link href="/locations"><Button size="sm">Browse Locations</Button></Link>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400"><XCircle className="w-5 h-5" />Cancel Booking</DialogTitle>
            <DialogDescription>Credits will be refunded to your wallet.</DialogDescription>
          </DialogHeader>
          {cancelTarget && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="font-medium text-sm">{cancelTarget.resourceName || `Resource #${cancelTarget.resourceId}`}</p>
              <p className="text-xs text-muted-foreground mt-1">{cancelTarget.locationName} · {new Date(cancelTarget.startTime).toLocaleDateString("nl-NL")} · {parseFloat(cancelTarget.creditsCost || "0").toFixed(1)} credits</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep</Button>
            <Button variant="destructive" onClick={() => cancelMutation.mutate({ id: cancelTarget?.id, status: "cancelled" as const })} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
