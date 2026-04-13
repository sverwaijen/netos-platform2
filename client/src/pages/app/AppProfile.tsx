import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  User, Mail, Phone, Building2, LogOut, ChevronRight, ArrowLeft,
  Bell, Shield, HelpCircle, FileText, Settings, Loader2, Check,
} from "lucide-react";

export default function AppProfile() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profiel bijgewerkt");
      setEditMode(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const menuItems = [
    { icon: Bell, label: "Notificaties", desc: "Beheer meldingen", path: "/app/notifications" },
    { icon: Shield, label: "Privacy & Beveiliging", desc: "Wachtwoord, 2FA", path: "/app/security" },
    { icon: FileText, label: "Facturen", desc: "Bekijk factuurhistorie", path: "/app/invoices" },
    { icon: HelpCircle, label: "Help & Support", desc: "Veelgestelde vragen", path: "/app/support" },
    { icon: Settings, label: "Instellingen", desc: "App voorkeuren", path: "/app/settings" },
  ];

  if (editMode) {
    return (
      <div className="px-5 pt-6 pb-4 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditMode(false)} className="flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <h1 className="text-xl font-light text-white">Profiel Bewerken</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-xs block mb-1 tracking-[0.15em] uppercase">Naam</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#627653]/50"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs block mb-1 tracking-[0.15em] uppercase">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white/40 text-sm"
            />
            <p className="text-white/30 text-xs mt-1">Kan niet worden gewijzigd</p>
          </div>
          <div>
            <label className="text-white/60 text-xs block mb-1 tracking-[0.15em] uppercase">Telefoon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+31 6 12345678"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#627653]/50"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setEditMode(false)}
            className="flex-1 py-3 rounded-xl border border-white/[0.1] text-white text-sm font-medium"
          >
            Annuleren
          </button>
          <button
            onClick={() => {
              updateProfile.mutate({
                name: formData.name,
                phone: formData.phone || undefined,
              });
            }}
            disabled={updateProfile.isPending}
            className="flex-1 py-3 rounded-xl bg-[#627653] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {updateProfile.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {updateProfile.isPending ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <h1 className="text-xl font-light text-white">Profiel</h1>

      {/* Profile Card */}
      <div className="bg-white/[0.03] rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
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
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-xs font-medium hover:bg-white/[0.08] transition-colors"
          >
            Bewerk
          </button>
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
