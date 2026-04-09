import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import {
  Car, MapPin, Clock, Calendar, CheckCircle2,
  AlertCircle, ChevronRight, Users, Shield, QrCode,
  UserPlus, Send, Zap, TrendingUp, AlertTriangle,
} from "lucide-react";

export default function AppParking() {
  const { user } = useAuth();
  const { data: zones = [] } = trpc.parkingZones.list.useQuery();
  const { data: reservations = [] } = trpc.parkingReservations.list.useQuery({ status: "confirmed" });
  const { data: activeSessions = [] } = trpc.parkingSessions.active.useQuery();
  const { data: pools = [] } = trpc.parkingPools.list.useQuery();
  const { data: myVisitorPermits = [] } = trpc.parkingVisitorPermits.list.useQuery(
    user?.id ? { invitedByUserId: user.id } : undefined
  );

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    visitorName: "", visitorPhone: "", licensePlate: "",
    validFrom: Date.now(), validUntil: Date.now() + 8 * 60 * 60 * 1000,
    zoneId: 0,
  });

  const createVisitorPermit = trpc.parkingVisitorPermits.create.useMutation({
    onSuccess: (data) => {
      setShowInvite(false);
      // Could trigger WhatsApp share here
    },
  });

  // Find user's active session
  const mySession = activeSessions.find((s: any) => s.userId === user?.id);

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light text-white">Parkeren</h1>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 text-[#b8a472] text-xs font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Bezoeker uitnodigen
        </button>
      </div>

      {/* ── Active Session Card ── */}
      {mySession ? (
        <div className="bg-gradient-to-br from-[#627653] to-[#4a5c3f] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-10 -mt-10" />
          <div className="flex items-center gap-3 mb-3">
            <Car className="w-6 h-6 text-white" />
            <span className="text-white font-medium">Actieve Sessie</span>
            {mySession.accessType === "pool_guaranteed" && (
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full ml-auto">Pool (gegarandeerd)</span>
            )}
            {mySession.accessType === "pool_overflow" && (
              <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full ml-auto">Pool (overflow)</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/50 text-xs">Kenteken</p>
              <p className="text-white text-sm mt-0.5 font-mono">{mySession.licensePlate || "—"}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Gestart</p>
              <p className="text-white text-sm mt-0.5">
                {new Date(Number(mySession.entryTime)).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Duur</p>
              <p className="text-white text-sm mt-0.5">{Math.round((Date.now() - Number(mySession.entryTime)) / 60000)} min</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Toegang via</p>
              <p className="text-white text-sm mt-0.5">{mySession.entryMethod?.toUpperCase() || "ANPR"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.03] rounded-2xl p-6 text-center">
          <Car className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Geen actieve parkeersessie</p>
          <p className="text-white/15 text-xs mt-1">Rijd het terrein op — je kenteken wordt automatisch herkend</p>
        </div>
      )}

      {/* ── Pool Status ── */}
      {pools.length > 0 && (
        <div>
          <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Mijn Pools</h2>
          <div className="space-y-2">
            {pools.map((pool: any) => (
              <PoolStatusCard key={pool.id} pool={pool} />
            ))}
          </div>
        </div>
      )}

      {/* ── Invite Visitor Panel ── */}
      {showInvite && (
        <div className="bg-white/[0.05] rounded-2xl p-5 border border-white/[0.08]">
          <h3 className="text-white text-sm font-medium mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#b8a472]" />
            Bezoeker uitnodigen
          </h3>
          <div className="space-y-3">
            <input
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#b8a472]/50"
              placeholder="Naam bezoeker"
              value={inviteForm.visitorName}
              onChange={e => setInviteForm(p => ({ ...p, visitorName: e.target.value }))}
            />
            <input
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#b8a472]/50"
              placeholder="Telefoonnummer (voor WhatsApp)"
              value={inviteForm.visitorPhone}
              onChange={e => setInviteForm(p => ({ ...p, visitorPhone: e.target.value }))}
            />
            <input
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#b8a472]/50"
              placeholder="Kenteken (optioneel)"
              value={inviteForm.licensePlate}
              onChange={e => setInviteForm(p => ({ ...p, licensePlate: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/30 text-[10px]">Geldig vanaf</label>
                <input
                  type="datetime-local"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  onChange={e => setInviteForm(p => ({ ...p, validFrom: new Date(e.target.value).getTime() }))}
                />
              </div>
              <div>
                <label className="text-white/30 text-[10px]">Geldig tot</label>
                <input
                  type="datetime-local"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  onChange={e => setInviteForm(p => ({ ...p, validUntil: new Date(e.target.value).getTime() }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (zones[0]) {
                    createVisitorPermit.mutate({
                      ...inviteForm,
                      zoneId: inviteForm.zoneId || zones[0].id,
                      shareMethod: "whatsapp",
                    });
                  }
                }}
                className="flex-1 bg-[#25D366] text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Via WhatsApp
              </button>
              <button
                onClick={() => {
                  if (zones[0]) {
                    createVisitorPermit.mutate({
                      ...inviteForm,
                      zoneId: inviteForm.zoneId || zones[0].id,
                      shareMethod: "link",
                    });
                  }
                }}
                className="flex-1 bg-white/[0.08] text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                QR Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Zone Status ── */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Live Bezetting</h2>
        <div className="space-y-2">
          {zones.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">Geen zones geconfigureerd</p>
          ) : (
            zones.map((zone: any) => (
              <ZoneStatusCard key={zone.id} zone={zone} />
            ))
          )}
        </div>
      </div>

      {/* ── Active Visitor Permits ── */}
      {myVisitorPermits.length > 0 && (
        <div>
          <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Uitgenodigde Bezoekers</h2>
          <div className="space-y-2">
            {myVisitorPermits.slice(0, 5).map((vp: any) => (
              <div key={vp.id} className="bg-white/[0.03] rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{vp.visitorName}</p>
                  <p className="text-white/30 text-xs">
                    {vp.licensePlate || "Geen kenteken"} · {vp.usedEntries}/{vp.maxEntries} gebruikt
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  vp.status === "active" ? "bg-emerald-500/10 text-emerald-500" :
                  vp.status === "used" ? "bg-blue-500/10 text-blue-400" :
                  "bg-white/5 text-white/30"
                }`}>
                  {vp.status === "active" ? "Actief" : vp.status === "used" ? "Gebruikt" : vp.status === "expired" ? "Verlopen" : "Geannuleerd"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reservations ── */}
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
                    {new Date(res.date || res.reservationDate).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
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

// ─── Pool Status Card ────────────────────────────────────────────

function PoolStatusCard({ pool }: { pool: any }) {
  const { data: status } = trpc.parkingPools.status.useQuery({ poolId: pool.id });

  if (!status) return null;

  const guaranteedPercent = Math.round((status.currentGuaranteedUsed / Math.max(status.guaranteedSpots, 1)) * 100);
  const isAlmostFull = status.guaranteedAvailable <= 3 && status.guaranteedAvailable > 0;

  return (
    <div className="bg-white/[0.03] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{pool.name}</p>
            <p className="text-white/30 text-xs">{status.totalPoolMembers} leden</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          pool.slaTier === "platinum" ? "bg-slate-500/20 text-slate-300" :
          pool.slaTier === "gold" ? "bg-amber-500/20 text-amber-400" :
          pool.slaTier === "silver" ? "bg-gray-500/20 text-gray-300" :
          "bg-orange-500/20 text-orange-400"
        }`}>
          {pool.slaTier?.charAt(0).toUpperCase() + pool.slaTier?.slice(1)}
        </span>
      </div>

      {/* Pool bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-white/30">Gegarandeerde plekken</span>
          <span className={isAlmostFull ? "text-amber-400" : "text-white/50"}>
            {status.currentGuaranteedUsed}/{status.guaranteedSpots} bezet
          </span>
        </div>
        <div className="w-full h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status.isGuaranteedFull ? "bg-red-500" : isAlmostFull ? "bg-amber-500" : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(guaranteedPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Status message */}
      <div className="mt-3">
        {status.isGuaranteedFull ? (
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400">Pool vol — overflow actief (€{status.overflowPriceEur}/uur)</span>
          </div>
        ) : isAlmostFull ? (
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400">Nog {status.guaranteedAvailable} gegarandeerde {status.guaranteedAvailable === 1 ? "plek" : "plekken"}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">{status.guaranteedAvailable} plekken beschikbaar (gegarandeerd)</span>
          </div>
        )}
      </div>

      {/* Overflow info */}
      {status.overflowActive > 0 && (
        <div className="mt-2 bg-amber-500/5 rounded-lg p-2 text-[10px] text-amber-400/70">
          {status.overflowActive} auto('s) op overflow · €{status.overflowPriceEur}/uur · max €{status.overflowPriceDay}/dag
        </div>
      )}
    </div>
  );
}

// ─── Zone Status Card ────────────────────────────────────────────

function ZoneStatusCard({ zone }: { zone: any }) {
  const { data: capacity } = trpc.parkingZones.capacity.useQuery({ zoneId: zone.id });

  const occupancy = capacity?.occupancyPercent || 0;
  const barColor = occupancy > 80 ? "bg-red-500" : occupancy > 50 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="bg-white/[0.03] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#b8a472]/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-[#b8a472]" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{zone.name}</p>
            <p className="text-white/30 text-xs">
              {zone.type === "outdoor" ? "Buiten" : zone.type === "indoor" ? "Binnen" : zone.type === "underground" ? "Ondergronds" : "Dak"}
              {zone.accessMethod === "anpr" && " · ANPR"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white text-sm font-medium">{capacity?.available || 0}</p>
          <p className="text-white/30 text-[10px]">vrij</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${occupancy}%` }}
          />
        </div>
        <span className="text-white/40 text-xs flex-shrink-0">{occupancy}%</span>
      </div>
      {/* Breakdown */}
      {capacity && (
        <div className="flex gap-3 mt-2 text-[10px] text-white/20">
          {capacity.poolGuaranteedUsed > 0 && <span>Pool: {capacity.poolGuaranteedUsed}</span>}
          {capacity.poolOverflowUsed > 0 && <span>Overflow: {capacity.poolOverflowUsed}</span>}
          {capacity.visitorUsed > 0 && <span>Bezoekers: {capacity.visitorUsed}</span>}
          {capacity.payPerUseUsed > 0 && <span>Betaald: {capacity.payPerUseUsed}</span>}
        </div>
      )}
    </div>
  );
}
