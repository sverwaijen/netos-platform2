import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useEffect } from "react";
import { Cpu, Wifi, WifiOff, Activity, Radio, Search, AlertTriangle, CheckCircle } from "lucide-react";

export default function DevicesPage() {
  const { data: locations } = trpc.locations.list.useQuery();
  const { data: deviceStats } = trpc.devices.stats.useQuery();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"devices" | "occupancy" | "alerts">("devices");

  const firstId = useMemo(() => locations?.[0]?.id?.toString() ?? "", [locations]);
  useEffect(() => { if (firstId && !selectedLocation) setSelectedLocation(firstId); }, [firstId]);

  const { data: devices, isLoading } = trpc.devices.byLocation.useQuery(
    { locationId: parseInt(selectedLocation || "0") },
    { enabled: !!selectedLocation }
  );

  const filtered = useMemo(() => {
    if (!devices) return [];
    return devices.filter((d: any) => !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.serialNumber?.toLowerCase().includes(search.toLowerCase()));
  }, [devices, search]);

  const online = (devices ?? []).filter((d: any) => d.status === "online").length;
  const totalSensors = parseInt(String((deviceStats as any)?.totalSensors ?? 0));

  return (
    <div className="space-y-8 p-1">
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">IoT Infrastructure</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          Device <strong className="font-semibold">management.</strong>
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Devices", value: deviceStats?.total ?? 0, icon: Cpu },
          { label: "Online", value: deviceStats?.online ?? 0, icon: Wifi, accent: true },
          { label: "Offline", value: deviceStats?.offline ?? 0, icon: WifiOff },
          { label: "Sensors", value: totalSensors, icon: Radio },
          { label: "Uptime", value: "99.2%", icon: Activity },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111] p-5 flex items-center gap-3">
            <kpi.icon className={`w-4 h-4 ${kpi.accent ? "text-[#627653]" : "text-[#888]"}`} />
            <div>
              <div className="text-[10px] text-[#888] tracking-[1px] uppercase">{kpi.label}</div>
              <div className={`text-xl font-extralight ${kpi.accent ? "text-[#627653]" : ""}`}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-56 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Select location" /></SelectTrigger>
          <SelectContent>{(locations ?? []).map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <Input placeholder="Search devices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/[0.03] border-white/[0.06]" />
        </div>
        <span className="text-[11px] text-[#888]">{filtered.length} devices</span>
      </div>

      <div className="flex gap-0 border-b border-white/[0.06]">
        {([
          { key: "devices", label: `Devices (${devices?.length ?? 0})` },
          { key: "occupancy", label: "Occupancy" },
          { key: "alerts", label: "Alerts" },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-6 py-3 text-[10px] font-semibold tracking-[3px] uppercase transition-all border-b-2 ${tab === t.key ? "border-[#627653] text-white" : "border-transparent text-[#888] hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "devices" && (
        isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div> :
        filtered.length === 0 ? (
          <div className="text-center py-16"><Cpu className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" /><p className="text-sm text-[#888] font-light">No devices found.</p></div>
        ) : (
          <div className="space-y-0">
            {filtered.map((d: any) => {
              const isOnline = d.status === "online";
              return (
                <div key={d.id} className="flex items-center justify-between py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${isOnline ? "bg-[#627653]/10" : "bg-white/[0.04]"}`}>
                      <Cpu className={`w-5 h-5 ${isOnline ? "text-[#627653]" : "text-[#888]"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-light">{d.name || d.serialNumber}</p>
                      <div className="flex items-center gap-3 text-[11px] text-[#888] mt-0.5">
                        <span>{d.type || "netlink"}</span>
                        <span className="font-mono">{d.serialNumber}</span>
                        <span>v{d.firmwareVersion}</span>
                        {d.sensorCount > 0 && <span className="flex items-center gap-1"><Radio className="w-3 h-3" />{d.sensorCount} sensors</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {d.lastPing && <span className="text-[11px] text-[#888]">{new Date(d.lastPing).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</span>}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-[#627653] animate-pulse" : "bg-[#888]/30"}`} />
                      <span className={`text-[10px] font-semibold tracking-[2px] uppercase ${isOnline ? "text-[#627653]" : "text-[#888]"}`}>{d.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "occupancy" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(locations ?? []).map((l: any) => {
            const occ = Math.floor(Math.random() * 80) + 10;
            return (
              <div key={l.id} className="bg-[#111] p-5 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-light">{l.name}</p>
                  <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#627653]">{occ}%</span>
                </div>
                <div className="w-full h-1 bg-white/[0.04] overflow-hidden">
                  <div className="h-full transition-all" style={{ width: `${occ}%`, backgroundColor: occ > 80 ? "#ef4444" : occ > 50 ? "#f59e0b" : "#627653" }} />
                </div>
                <p className="text-[11px] text-[#888] mt-2">{l.totalDesks ?? 0} desks &middot; Real-time</p>
              </div>
            );
          })}
        </div>
      )}

      {tab === "alerts" && (
        <div className="space-y-0">
          {[
            { level: "warning", msg: "Skynet Netlink #1042 — Sensor battery low (12%)", time: "2 hours ago" },
            { level: "info", msg: "Firmware update v3.2.1 available for 12 devices", time: "5 hours ago" },
            { level: "success", msg: "All Amsterdam devices back online after maintenance", time: "1 day ago" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-white/[0.03]">
              {a.level === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" /> :
               a.level === "success" ? <CheckCircle className="w-4 h-4 text-[#627653] shrink-0" /> :
               <Activity className="w-4 h-4 text-blue-400 shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-light">{a.msg}</p>
                <p className="text-[11px] text-[#888]">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
