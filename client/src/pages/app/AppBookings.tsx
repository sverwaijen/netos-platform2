import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Calendar, Clock, MapPin, Plus, Coffee, ChevronRight } from "lucide-react";

export default function AppBookings() {
  const [, navigate] = useLocation();
  const { data: bookings = [] } = trpc.bookings.mine.useQuery();

  const now = Date.now();
  const upcoming = bookings.filter((b: any) => b.status === "confirmed" && b.startTime > now);
  const active = bookings.filter((b: any) => b.status === "confirmed" && b.startTime <= now && b.endTime > now);
  const past = bookings.filter((b: any) => b.status !== "confirmed" || b.endTime <= now);

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light text-white">Boekingen</h1>
        <button
          onClick={() => navigate("/app/bookings/new")}
          className="w-9 h-9 rounded-full bg-[#C4B89E] flex items-center justify-center"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Active (currently in progress) */}
      {active.length > 0 && (
        <div>
          <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Nu actief</h2>
          <div className="space-y-2">
            {active.map((b: any) => (
              <div key={b.id} className="bg-[#627653]/10 border border-[#627653]/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#627653]/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-[#627653]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{b.resourceName || "Ruimte"}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-white/40 text-xs">
                        <Clock className="w-3 h-3" />
                        {new Date(b.startTime).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(b.endTime).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {b.locationName && (
                        <span className="flex items-center gap-1 text-white/40 text-xs">
                          <MapPin className="w-3 h-3" />
                          {b.locationName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-[#627653]/20 text-[#627653] text-[10px] font-medium">
                    Actief
                  </span>
                </div>
                {/* Order from room button */}
                <button
                  onClick={() => navigate(`/app/order?bookingId=${b.id}&locationId=${b.locationId}&resource=${encodeURIComponent(b.resourceName || "Ruimte")}`)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#627653] text-white text-sm font-medium transition-all active:scale-[0.98]"
                >
                  <Coffee className="w-4 h-4" />
                  Bestel naar je ruimte
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Komend</h2>
        {upcoming.length === 0 && active.length === 0 ? (
          <div className="bg-white/[0.03] rounded-2xl p-8 text-center">
            <Calendar className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Geen komende boekingen</p>
            <button onClick={() => navigate("/app/bookings/new")} className="mt-3 text-[#C4B89E] text-sm font-medium">
              Boek een ruimte
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b: any) => (
              <div key={b.id} className="bg-white/[0.03] rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#C4B89E]/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-[#C4B89E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{b.resourceName || "Ruimte"}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-white/40 text-xs">
                        <Clock className="w-3 h-3" />
                        {new Date(b.startTime).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      <span className="text-white/40 text-xs">
                        {new Date(b.startTime).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(b.endTime).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-1 rounded-full bg-[#C4B89E]/10 text-[#C4B89E] text-[10px] font-medium">
                      Bevestigd
                    </span>
                    <button
                      onClick={() => navigate(`/app/order?bookingId=${b.id}&locationId=${b.locationId}&resource=${encodeURIComponent(b.resourceName || "Ruimte")}`)}
                      className="w-8 h-8 rounded-lg bg-[#627653]/10 flex items-center justify-center"
                      title="Bestel naar je ruimte"
                    >
                      <Coffee className="w-4 h-4 text-[#627653]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Afgelopen</h2>
          <div className="space-y-2">
            {past.slice(0, 5).map((b: any) => (
              <div key={b.id} className="bg-white/[0.02] rounded-xl p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 text-sm truncate">{b.resourceName || "Ruimte"}</p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {new Date(b.startTime).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
