import { trpc } from "@/lib/trpc";
import {
  Car, MapPin, Clock, Calendar, CheckCircle2,
  AlertCircle, ChevronRight,
} from "lucide-react";

export default function AppParking() {
  const { data: zones = [] } = trpc.parkingZones.list.useQuery();
  const { data: reservations = [] } = trpc.parkingReservations.list.useQuery({ status: "confirmed" });

  const activeSession: any = null; // TODO: add session tracking

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <h1 className="text-xl font-light text-white">Parkeren</h1>

      {/* Active Session */}
      {activeSession ? (
        <div className="bg-gradient-to-br from-[#627653] to-[#4a5c3f] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-10 -mt-10" />
          <div className="flex items-center gap-3 mb-3">
            <Car className="w-6 h-6 text-white" />
            <span className="text-white font-medium">Actieve Sessie</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/50 text-xs">Zone</p>
              <p className="text-white text-sm mt-0.5">{activeSession.zoneName || "Parkeergarage"}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Plek</p>
              <p className="text-white text-sm mt-0.5">{activeSession.spotLabel || "—"}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Gestart</p>
              <p className="text-white text-sm mt-0.5">
                {new Date(activeSession.entryTime).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Kenteken</p>
              <p className="text-white text-sm mt-0.5">{activeSession.licensePlate || "—"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.03] rounded-2xl p-6 text-center">
          <Car className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Geen actieve parkeersessie</p>
        </div>
      )}

      {/* Zones Overview */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Parkeer Zones</h2>
        <div className="space-y-2">
          {zones.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">Geen zones geconfigureerd</p>
          ) : (
            zones.map((zone: any) => (
              <div key={zone.id} className="bg-white/[0.03] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#b8a472]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#b8a472]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{zone.name}</p>
                      <p className="text-white/30 text-xs">{zone.type === "covered" ? "Overdekt" : zone.type === "underground" ? "Ondergronds" : "Open"}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#627653] transition-all"
                      style={{ width: `${((zone.totalSpots - (zone.availableSpots || 0)) / Math.max(zone.totalSpots, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-white/40 text-xs flex-shrink-0">
                    {zone.availableSpots || 0}/{zone.totalSpots} vrij
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reservations */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Reserveringen</h2>
        {reservations.length === 0 ? (
          <div className="bg-white/[0.03] rounded-2xl p-6 text-center">
            <Calendar className="w-8 h-8 text-white/15 mx-auto mb-2" />
            <p className="text-white/30 text-sm">Geen reserveringen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reservations.map((res: any) => (
              <div key={res.id} className="bg-white/[0.03] rounded-xl p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#b8a472]" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{res.zoneName || "Parkeerplaats"}</p>
                  <p className="text-white/30 text-xs">
                    {new Date(res.date).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  res.status === "confirmed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                }`}>
                  {res.status === "confirmed" ? "Bevestigd" : "Wachtend"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
