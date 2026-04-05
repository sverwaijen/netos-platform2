import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  User, Mail, Phone, Building2, LogOut, ChevronRight,
  Bell, Shield, HelpCircle, FileText, Settings,
} from "lucide-react";

export default function AppProfile() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const menuItems = [
    { icon: Bell, label: "Notificaties", desc: "Beheer meldingen", path: "/app/notifications" },
    { icon: Shield, label: "Privacy & Beveiliging", desc: "Wachtwoord, 2FA", path: "/app/security" },
    { icon: FileText, label: "Facturen", desc: "Bekijk factuurhistorie", path: "/app/invoices" },
    { icon: HelpCircle, label: "Help & Support", desc: "Veelgestelde vragen", path: "/app/support" },
    { icon: Settings, label: "Instellingen", desc: "App voorkeuren", path: "/app/settings" },
  ];

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <h1 className="text-xl font-light text-white">Profiel</h1>

      {/* Profile Card */}
      <div className="bg-white/[0.03] rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#627653] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-medium">
              {user?.name?.[0] || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-lg font-medium truncate">{user?.name || "Member"}</p>
            <p className="text-white/40 text-sm truncate">{user?.email || ""}</p>
            {user?.phone && (
              <p className="text-white/30 text-xs mt-0.5">{user.phone}</p>
            )}
          </div>
        </div>

        {/* Member info */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/30 text-[10px] tracking-[0.15em] uppercase">Lid sinds</p>
            <p className="text-white/60 text-sm mt-0.5">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("nl-NL", { month: "long", year: "numeric" }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-white/30 text-[10px] tracking-[0.15em] uppercase">Rol</p>
            <p className="text-white/60 text-sm mt-0.5 capitalize">{user?.role || "member"}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => {
                // Placeholder - toast for unbuilt pages
                if (["/app/notifications", "/app/security", "/app/invoices", "/app/settings"].includes(item.path)) {
                  import("sonner").then(({ toast }) => toast.info("Binnenkort beschikbaar"));
                } else {
                  navigate(item.path);
                }
              }}
              className="w-full flex items-center gap-4 py-3.5 px-1 transition-all active:bg-white/[0.02] rounded-lg"
            >
              <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-white/40" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white text-sm">{item.label}</p>
                <p className="text-white/30 text-xs">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/15 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-sm font-medium transition-all active:bg-red-500/10"
      >
        <LogOut className="w-4 h-4" />
        Uitloggen
      </button>

      {/* App version */}
      <p className="text-center text-white/15 text-[10px]">Mr. Green Members App v1.0.0</p>
    </div>
  );
}
