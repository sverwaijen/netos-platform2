import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Calendar, Wallet, Key, Car, LifeBuoy, ChevronRight,
  MapPin, Clock, Wifi, Coffee, CreditCard, Bell,
} from "lucide-react";

export default function AppHome() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: wallets } = trpc.wallets.mine.useQuery();
  const { data: bookings } = trpc.bookings.mine.useQuery();
  const { data: notifications } = trpc.notifications.mine.useQuery();

  const personalWallet = wallets?.find((w: any) => w.type === "personal");
  const upcomingBookings = bookings?.filter((b: any) => b.status === "confirmed").slice(0, 3) || [];
  const unreadNotifications = notifications?.filter((n: any) => !n.isRead).length || 0;

  const firstName = user?.name?.split(" ")[0] || "Member";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs tracking-[0.15em] uppercase">{greeting}</p>
          <h1 className="text-2xl font-light text-white mt-1">{firstName}</h1>
        </div>
        <button
          onClick={() => navigate("/app/profile")}
          className="relative w-10 h-10 rounded-full bg-[#627653] flex items-center justify-center"
        >
          <span className="text-white font-medium text-sm">{firstName[0]}</span>
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </button>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/app/access")}
          className="bg-[#627653]/10 border border-[#627653]/20 rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
        >
          <Key className="w-6 h-6 text-[#627653] mb-3" />
          <p className="text-white text-sm font-medium">Digitale Sleutel</p>
          <p className="text-white/40 text-xs mt-1">Open deuren</p>
        </button>
        <button
          onClick={() => navigate("/app/wallet")}
          className="bg-[#b8a472]/10 border border-[#b8a472]/20 rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
        >
          <Wallet className="w-6 h-6 text-[#b8a472] mb-3" />
          <p className="text-white text-sm font-medium">Wallet</p>
          <p className="text-[#b8a472] text-xs mt-1 font-semibold">
            {personalWallet ? `${parseFloat(personalWallet.balance).toFixed(0)} credits` : "—"}
          </p>
        </button>
      </div>

      {/* Upcoming Bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium">Komende Boekingen</h2>
          <button onClick={() => navigate("/app/bookings")} className="text-[#627653] text-xs flex items-center gap-1">
            Alles <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {upcomingBookings.length === 0 ? (
          <div className="bg-white/[0.03] rounded-2xl p-6 text-center">
            <Calendar className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/30 text-sm">Geen komende boekingen</p>
            <button
              onClick={() => navigate("/app/bookings")}
              className="mt-3 text-[#627653] text-xs font-medium"
            >
              Boek een ruimte
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map((booking: any) => (
              <div key={booking.id} className="bg-white/[0.03] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#627653]/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#627653]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{booking.resourceName || "Ruimte"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-white/30" />
                    <p className="text-white/40 text-xs">
                      {new Date(booking.startTime).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}
                      {new Date(booking.startTime).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(booking.endTime).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Snelle Acties</h2>
        <div className="space-y-2">
          {[
            { icon: Coffee, label: "Butler Bestellen", desc: "Koffie, lunch & meer", path: "/butler", color: "#627653" },
            { icon: Car, label: "Parkeren", desc: "Reserveer een plek", path: "/app/parking", color: "#b8a472" },
            { icon: Wifi, label: "WiFi Verbinden", desc: "Mr. Green Network", path: "/app/access", color: "#627653" },
            { icon: LifeBuoy, label: "Support", desc: "Hulp nodig?", path: "/app/support", color: "#8B7355" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-4 bg-white/[0.03] rounded-xl p-4 transition-all active:scale-[0.99] active:bg-white/[0.05]"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: action.color + "15" }}>
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium">{action.label}</p>
                  <p className="text-white/40 text-xs">{action.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
