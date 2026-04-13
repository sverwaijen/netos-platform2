import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Calendar, Clock, MapPin, X, Plus } from "lucide-react";

type Tab = "upcoming" | "past" | "all";

export default function Bookings() {
  const { isAuthenticated } = useAuth();
  const { data: bookings, isLoading } = trpc.bookings.mine.useQuery(undefined, { enabled: isAuthenticated });
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("upcoming");

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

  const now = Date.now();
  const CANCEL_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

  const upcoming = useMemo(() => (bookings ?? []).filter((b: any) => new Date(b.startTime).getTime() > now && b.status !== "cancelled"), [bookings, now]);
  const past = useMemo(() => (bookings ?? []).filter((b: any) => new Date(b.startTime).getTime() <= now || b.status === "cancelled"), [bookings, now]);
  const filtered = tab === "upcoming" ? upcoming : tab === "past" ? past : (bookings ?? []);
  const totalSpent = (bookings ?? []).filter((b: any) => b.status !== "cancelled").reduce((sum: number, b: any) => sum + parseFloat(b.creditsCost || "0"), 0);
  const totalHours = (bookings ?? []).filter((b: any) => b.status !== "cancelled").reduce((sum: number, b: any) => {
    return sum + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3600000;
  }, 0);

  const canCancelBooking = (booking: any) => {
    const start = new Date(booking.startTime).getTime();
    const timeUntilStart = start - now;
    return booking.status !== "cancelled" && timeUntilStart >= CANCEL_THRESHOLD_MS;
  };

  const getCancelButtonTooltip = (booking: any) => {
    if (booking.status === "cancelled") return "Already cancelled";
    const start = new Date(booking.startTime).getTime();
    const timeUntilStart = start - now;
    if (timeUntilStart < CANCEL_THRESHOLD_MS) {
      const minutesLeft = Math.floor(timeUntilStart / 60000);
      return `Can only cancel 1 hour before start (${minutesLeft} min remaining)`;
    }
    return "Cancel this booking";
  };

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Reservations</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Your <strong className="font-semibold">bookings.</strong>
          </h1>
        </div>
        <Link href="/locations">
          <button className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-[#627653] text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#4a5a3f] transition-all w-full sm:w-auto justify-center">
            <Plus className="w-3.5 h-3.5" />New booking
          </button>
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Total", value: `${(bookings ?? []).length}` },
          { label: "Upcoming", value: `${upcoming.length}`, accent: true },
          { label: "Credits Spent", value: `${totalSpent.toFixed(0)}c` },
          { label: "Hours Booked", value: `${totalHours.toFixed(0)}h` },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111] p-5">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">{kpi.label}</div>
            <div className={`text-2xl font-extralight ${kpi.accent ? "text-[#627653]" : ""}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/[0.06] overflow-x-auto">
        {(["upcoming", "past", "all"] as Tab[]).map((t) => {
          const count = t === "upcoming" ? upcoming.length : t === "past" ? past.length : (bookings ?? []).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 sm:px-6 py-3 text-[10px] font-semibold tracking-[2px] sm:tracking-[3px] uppercase transition-all border-b-2 whitespace-nowrap ${
                tab === t ? "border-[#627653] text-white" : "border-transparent text-[#888] hover:text-white"
              }`}
            >
              {t} ({count})
            </button>
          );
        })}
      </div>

      {/* Booking list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
          <p className="text-sm text-[#888] font-light">No {tab} bookings found.</p>
          <Link href="/locations">
            <button className="mt-4 text-[10px] text-[#627653] tracking-[2px] uppercase font-semibold hover:underline">Browse locations</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-0">
          {filtered.map((b: any) => {
            const start = new Date(b.startTime);
            const end = new Date(b.endTime);
            const isPast = start.getTime() <= now;
            const isCancelled = b.status === "cancelled";
            const canCancel = canCancelBooking(b);
            const tooltip = getCancelButtonTooltip(b);
            return (
              <div key={b.id} className={`flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors gap-3 ${isCancelled ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-12 text-center">
                    <div className="text-[10px] text-[#888] uppercase">{start.toLocaleDateString("en-US", { month: "short" })}</div>
                    <div className="text-xl font-extralight">{start.getDate()}</div>
                  </div>
                  <div className="w-px h-10 bg-white/[0.06]" />
                  <div>
                    <p className="text-sm font-light">{b.resourceName || "Resource"}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#888] mt-0.5">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.locationName || "Location"}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{start.getHours()}:00 &ndash; {end.getHours()}:00</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 ml-0 sm:ml-auto shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#627653]">{parseFloat(b.creditsCost || "0").toFixed(1)}c</p>
                    <p className="text-[10px] text-[#888]">
                      {isCancelled ? "Cancelled" : isPast ? "Completed" : "Confirmed"}
                    </p>
                  </div>
                  <div className="relative group">
                    <button
                      onClick={() => canCancel && setCancelTarget(b)}
                      disabled={!canCancel}
                      title={tooltip}
                      className={`w-8 h-8 flex items-center justify-center rounded border transition-all ${
                        canCancel
                          ? "border-white/[0.06] hover:border-red-500/30 hover:bg-red-500/10 cursor-pointer"
                          : "border-white/[0.03] opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <X className="w-3.5 h-3.5 text-[#888]" />
                    </button>
                    {!canCancel && (
                      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-[#1a1a1a] border border-white/[0.1] rounded text-[10px] text-[#888] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {tooltip}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">Cancel booking?</DialogTitle>
          </DialogHeader>
          {cancelTarget && (
            <div className="space-y-4">
              <div className="bg-white/[0.03] p-4">
                <p className="text-sm font-light">{cancelTarget.resourceName || "Resource"}</p>
                <p className="text-[11px] text-[#888] mt-1">{cancelTarget.locationName} &middot; {new Date(cancelTarget.startTime).toLocaleDateString("nl-NL")} &middot; {parseFloat(cancelTarget.creditsCost || "0").toFixed(1)} credits</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                <p className="text-[12px] text-green-400 font-light">
                  Credit refund: <strong>{parseFloat(cancelTarget.creditsCost || "0").toFixed(1)}c</strong> will be returned to your wallet
                </p>
              </div>
              <p className="text-[13px] text-[#888] font-light">
                Cancellations can only be made at least 1 hour before the booking start time.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)} className="border-white/10 bg-transparent hover:bg-white/5">Keep</Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate({ id: cancelTarget?.id, status: "cancelled" as const })}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
