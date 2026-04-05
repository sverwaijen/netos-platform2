import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Key, Wifi, Car, DoorOpen, Shield, Smartphone,
  ChevronRight, CheckCircle2, Lock, Signal, MapPin,
} from "lucide-react";
import { toast } from "sonner";

const DOORS = [
  { id: 1, name: "Hoofdingang", floor: "BG", status: "locked", type: "main" },
  { id: 2, name: "Coworking Floor", floor: "2", status: "locked", type: "floor" },
  { id: 3, name: "Meeting Rooms", floor: "1", status: "locked", type: "floor" },
  { id: 4, name: "Fietsenstalling", floor: "BG", status: "locked", type: "utility" },
  { id: 5, name: "Parkeergarage", floor: "-1", status: "locked", type: "parking" },
];

export default function AppAccess() {
  const { user } = useAuth();
  const [openingDoor, setOpeningDoor] = useState<number | null>(null);
  const [wifiConnected, setWifiConnected] = useState(false);

  const handleOpenDoor = (doorId: number, doorName: string) => {
    setOpeningDoor(doorId);
    // Simulate Salto KS door open
    setTimeout(() => {
      setOpeningDoor(null);
      toast.success(`${doorName} geopend`, { description: "Deur ontgrendeld voor 5 seconden" });
    }, 1500);
  };

  const handleConnectWifi = () => {
    setWifiConnected(true);
    toast.success("Verbonden met Mr. Green WiFi", { description: "Netwerk: MrGreen-Members" });
  };

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <h1 className="text-xl font-light text-white">Toegang</h1>

      {/* Digital Key Card */}
      <div className="bg-gradient-to-br from-[#627653] to-[#4a5c3f] rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -ml-8 -mb-8" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">Digitale Sleutel</p>
            <p className="text-white/50 text-xs">Salto KS Mobile Key</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-white/40" />
          <span className="text-white/50 text-xs">BLE + NFC beveiligd</span>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px]">
            Actief
          </span>
        </div>
      </div>

      {/* Doors */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Deuren</h2>
        <div className="space-y-2">
          {DOORS.map((door) => (
            <button
              key={door.id}
              onClick={() => handleOpenDoor(door.id, door.name)}
              disabled={openingDoor !== null}
              className="w-full flex items-center gap-4 bg-white/[0.03] rounded-xl p-4 transition-all active:scale-[0.99] active:bg-white/[0.05] disabled:opacity-50"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                openingDoor === door.id ? "bg-emerald-500/10" : "bg-white/[0.05]"
              }`}>
                {openingDoor === door.id ? (
                  <DoorOpen className="w-5 h-5 text-emerald-500 animate-pulse" />
                ) : (
                  <Lock className="w-5 h-5 text-white/40" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white text-sm font-medium">{door.name}</p>
                <p className="text-white/30 text-xs">Verdieping {door.floor}</p>
              </div>
              {openingDoor === door.id ? (
                <span className="text-emerald-500 text-xs font-medium animate-pulse">Openen...</span>
              ) : (
                <span className="text-white/20 text-xs">Tik om te openen</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* WiFi */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">WiFi</h2>
        <button
          onClick={handleConnectWifi}
          className="w-full flex items-center gap-4 bg-white/[0.03] rounded-xl p-4 transition-all active:scale-[0.99]"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            wifiConnected ? "bg-[#627653]/10" : "bg-white/[0.05]"
          }`}>
            <Wifi className={`w-5 h-5 ${wifiConnected ? "text-[#627653]" : "text-white/40"}`} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white text-sm font-medium">MrGreen-Members</p>
            <p className="text-white/30 text-xs">
              {wifiConnected ? "Verbonden · UniFi Identity" : "Beveiligd netwerk"}
            </p>
          </div>
          {wifiConnected ? (
            <CheckCircle2 className="w-5 h-5 text-[#627653]" />
          ) : (
            <span className="text-[#627653] text-xs font-medium">Verbinden</span>
          )}
        </button>

        <div className="mt-2 flex items-center gap-4 bg-white/[0.03] rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
            <Signal className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white text-sm font-medium">MrGreen-Guest</p>
            <p className="text-white/30 text-xs">Open netwerk voor bezoekers</p>
          </div>
        </div>
      </div>

      {/* Parking */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Parkeren</h2>
        <div className="bg-white/[0.03] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#b8a472]/10 flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-[#b8a472]" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">Parkeerplaats</p>
            <p className="text-white/30 text-xs">Geen actieve sessie</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/20" />
        </div>
      </div>
    </div>
  );
}
